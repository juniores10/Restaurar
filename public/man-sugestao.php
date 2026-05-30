<?php session_start(); ?>
<!DOCTYPE html>
<html lang="pt_br">

<head>
     <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
     <meta name="description" content="Profsa Informática - Gerenciamento de Colaboradores" />
     <meta name="author" content="Paulo Rogério Souza" />
     <meta name="viewport" content="width=device-width, initial-scale=1" />

     <link href="https://fonts.googleapis.com/css?family=Lato:300,400" rel="stylesheet" type="text/css" />
     <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400" rel="stylesheet" type="text/css" />

     <link href="//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet">

     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.2/animate.css">

     <link rel="shortcut icon" href="https://www.profsa.com.br/pallas56/img/logo-00.png" />

     <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>

     <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

     <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"
          integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
     <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"
          integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous">
     </script>
     <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"
          integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous">
     </script>

     <script type="text/javascript" language="javascript"
          src="https://cdn.datatables.net/1.10.15/js/jquery.dataTables.min.js"></script>
     <link href="https://cdn.datatables.net/1.10.15/css/jquery.dataTables.min.css" rel="stylesheet" type="text/css" />

     <link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
     <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>

     <link href="css/pallas56.css" rel="stylesheet" type="text/css" media="screen" />
     <title>Sugestões - Gerenciamento de Colaboradores</title>
</head>

<script>
$(document).ready(function() {
     if (localStorage.dic_s == undefined) {
          $('#tel_c').hide();
          localStorage.setItem('dic_s', 1);
     }

     $('#tab-0').DataTable({
          "pageLength": 50,
          "aaSorting": [
               [4, 'asc'],
               [2, 'asc']
          ],
          "language": {
               "lengthMenu": "Demonstrar _MENU_ linhas por páginas",
               "zeroRecords": "Não existe registros a demonstrar ...",
               "info": "Mostrada página _PAGE_ de _PAGES_",
               "infoEmpty": "Sem registros de sugestão ...",
               "sSearch": "Buscar:",
               "infoFiltered": "(Consulta de _TOTAL_/_MAX_ total de linhas)",
               "oPaginate": {
                    sFirst: "Primeiro",
                    sLast: "Último",
                    sNext: "Próximo",
                    sPrevious: "Anterior"
               }
          }
     });

     $("#mos_t").click(function() {
          $('#tel_c').fadeToggle();
     });

     $(window).scroll(function() {
          if ($(this).scrollTop() > 100) {
               $(".subir").fadeIn(500);
          } else {
               $(".subir").fadeOut(250);
          }
     });

     $(".subir").click(function() {
          $topo = $("#box00").offset().top;
          $('html, body').animate({
               scrollTop: $topo
          }, 1500);
     });

});
</script>

<?php
     $ret = 0; 
     $per = "";
     $del = "";
     $bot = "Salvar";
     include_once "dados.php";
     include_once "profsa.php";
     $_SESSION['wrkendser'] = getenv("REMOTE_ADDR");
     date_default_timezone_set("America/Sao_Paulo");

     if (isset($_SESSION['wrkopereg']) == false) { $_SESSION['wrkopereg'] = 0; }
     if (isset($_SESSION['wrkcodreg']) == false) { $_SESSION['wrkcodreg'] = 0; }
     if (isset($_REQUEST['ope']) == true) { $_SESSION['wrkopereg'] = $_REQUEST['ope']; }
     if (isset($_REQUEST['cod']) == true) { $_SESSION['wrkcodreg'] = $_REQUEST['cod']; }

     if ($_SESSION['wrkopereg'] == 1) { 
          $_SESSION['wrkcodreg'] = ultimo_cod();
     }
     if ($_SESSION['wrkopereg'] == 3) { 
          $bot = 'Deletar'; 
          $del = "cor-2";
          $per = ' onclick="return confirm(\'Confirma exclusão de sugestão informada em tela ?\')" ';
     }  

     if ($_SESSION['wrkopereg'] == 2 || $_SESSION['wrkopereg'] == 3) {
          if (isset($_REQUEST['salvar']) == false) { 
               $cha = $_SESSION['wrkcodreg']; $_SESSION['wrknumcha'] = $_SESSION['wrkcodreg']; 
               $ret = ler_sugestao($_SESSION['wrkcodreg']); 
          }
     }

     if (isset($_REQUEST['salvar']) == true) {
          if ($_SESSION['wrkopereg'] == 1) {
               $ret = consiste_sug();
               if ($ret == 0) {
                    $ret = incluir_sug();
                    $ret = envia_ema($_REQUEST['tit'], $_REQUEST['des'], $_SESSION['wrknomusu']);
                    echo '<script>alert("E-Mail enviado com Sucesso para a direção ! Obrigado !");</script>';
                    $ret = gravar_log(11,"Inclusão de nova sugestão: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
                    exit('<script>location.href = "man-sugestao.php?ope=1&cod=0"</script>'); 
               }
          }
          if ($_SESSION['wrkopereg'] == 2) {
               $ret = consiste_sug();
               if ($ret == 0) {
                    $ret = alterar_sug();
                    $ret = envia_ema($_REQUEST['tit'], $_REQUEST['des'], $_SESSION['wrknomusu']);
                    echo '<script>alert("E-Mail enviado com Sucesso para a direção ! Obrigado !");</script>';
                    $ret = gravar_log(12,"Alteração de sugestão existente: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
                    exit('<script>location.href = "man-sugestao.php?ope=1&cod=0"</script>'); 
               }
          }
          if ($_SESSION['wrkopereg'] == 3) {
               $ret = excluir_sug();
               $ret = gravar_log(13,"Exclusão de sugestão existente: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
               exit('<script>location.href = "man-sugestao.php?ope=1&cod=0"</script>'); 
          }
     }

?>

<body id="box00">
     <div class="container-fluid">
          <div class="row">
               <div id="men-2" class="cab-a col-md-2">
                    <?php include_once "cabecalho-2.php"; ?>
               </div>
               <div class="col-md-10">
                    <br />
                    <div class="row">
                         <div class="col-md-10">
                              <h3 class="cor-4"><strong>Manutenção de Sugestões</strong></h3>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="mos_t" href="#"
                                   title="Mostra e esconde a página detalhada com os dados de sugestão para edição.">
                                   <i class="fa fa-eye fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                         <div class="col-md-1 text-center">
                              <a href="man-sugestao.php?ope=1&cod=0"
                                   title="Abre página para adicionar (criar) mais um sugestão dentro do sistema.">
                                   <i class="fa fa-plus-circle fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                    </div>
                    <br />
                    <form class="qua-2" id="tel_c" name="frmTelMan" action="man-sugestao.php" method="POST">
                         <div class="row">
                              <div class="col-md-2">
                                   <label>Código</label>
                                   <input type="text" class="form-control text-center" maxlength="6" id="cod" name="cod"
                                        value="<?php echo $_SESSION['wrkcodreg']; ?>" disabled />
                              </div>
                              <div class="col-md-8">
                                   <label>Título da Sugestão</label>
                                   <input type="text" class="form-control" maxlength="50" id="tit" name="tit"
                                        value="<?php echo (isset($_REQUEST['tit']) == false ? "" : $_REQUEST['tit']); ?>"
                                        required />
                              </div>
                              <div class="col-md-2">
                                   <label>Status</label>
                                   <select name="sta" class="form-control">
                                        <option value="0"
                                             <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 0 ? '' : 'selected="selected"'); ?>>
                                             Normal
                                        </option>
                                        <option value="1"
                                             <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 1 ? '' : 'selected="selected"'); ?>>
                                             Bloqueado</option>
                                        <option value="2"
                                             <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 2 ? '' : 'selected="selected"'); ?>>
                                             Suspenso</option>
                                        <option value="3"
                                             <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 3 ? '' : 'selected="selected"'); ?>>
                                             Cancelado</option>
                                   </select>
                              </div>
                         </div>
                         <div class="row">
                              <div class="col-md-11">
                                   <label>Descrição da Dica ou Sugestão</label>
                                   <input type="text" class="form-control" maxlength="750" id="des" name="des"
                                        value="<?php echo (isset($_REQUEST['des']) == false ? "" : $_REQUEST['des']); ?>"
                                        required />
                              </div>
                              <div class="col-md-1 text-center"><br />
                                   <span>Identificar ?</span> &nbsp; <br />
                                   <input type="checkbox" id="ide" name="ide" value="1"
                                        <?php echo (isset($_REQUEST['ide']) == false ? "" : 'checked'); ?> />
                              </div>
                         </div>
                         <br />
                         <div class="row text-center">
                              <div class="col-md-5"></div>
                              <div class="col-md-2">
                                   <button type="submit" name="salvar" <?php echo $per; ?>
                                        class="bot-1 <?php echo $del; ?>"><?php echo $bot; ?></button>
                              </div>
                              <div class="col-md-3"></div>
                         </div>
                         <br />
                    </form>
                    <div class="container-fluid">
                         <hr />
                         <div class="row">
                              <div class="tab-1 table-responsive">
                                   <table id="tab-0" class="table table-sm table-striped">
                                        <thead>
                                             <tr>
                                                  <th width="2%" class="text-center">Alterar</th>
                                                  <th width="2%" class="text-center">Excluir</th>
                                                  <th width="2%" class="text-center">Código</th>
                                                  <th>Status</th>
                                                  <th>Nome do Funcionário</th>
                                                  <th>Título</th>
                                                  <th>Descrição da Sugestão</th>
                                                  <th class="text-center">Inclusão</th>
                                                  <th class="text-center">Alteração</th>
                                             </tr>
                                        </thead>
                                        <tbody>
                                             <?php $ret = carrega_sug();  ?>
                                        </tbody>
                                   </table>
                              </div>
                         </div>
                    </div>
               </div>
          </div>

          <div class="row">
               <img class="subir" src="img/subir.png" />
          </div>
     </div>
</body>

<?php
function ultimo_cod() {
     $cod = 1;
     include_once "dados.php";
     $nro = acessa_reg('Select idsugestao from tb_sugestao order by idsugestao desc Limit 1', $reg);
     if ($nro == 1) {
          $cod = $reg['idsugestao'] + 1;
     }        
     return $cod;
}

function consiste_sug() {
     $sta = 0;
     if (trim($_REQUEST['des']) == "") {
          echo '<script>alert("Descrição da Sugestão não pode estar em branco");</script>';
          return 1;
     }
     return $sta;
}

function ler_sugestao(&$cha) {
     include_once "dados.php";
     $nro = acessa_reg('Select * from tb_sugestao where idsugestao = ' . $cha, $reg);
     if ($nro == 0 || $reg == false) {
          echo '<script>alert("Código do Cargo informada não cadastrada");</script>';
          $nro = 1;
     } else {
          $_REQUEST['sta'] = $reg['sugstatus'];
          $_REQUEST['des'] = $reg['sugtitulo'];
          $_REQUEST['tit'] = $reg['sugdescricao'];
          if ($reg['sugtipo'] == 1) { $_REQUEST['ide'] = $reg['sugtipo'];}
     }
     return $cha;
}

function carrega_sug() {
     $ret = 0;
     include_once "dados.php";
     $com = "Select * from tb_sugestao order by sugtitulo, idsugestao";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          $txt =  '<tr>';
          $txt .= '<td class="text-center"><a href="man-sugestao.php?ope=2&cod=' . $lin['idsugestao'] . '" title="Efetua alteração do registro informado na linha"><i class="large material-icons">healing</i></a></td>';
          $txt .= '<td class="text-center"><a href="man-sugestao.php?ope=3&cod=' . $lin['idsugestao'] . '" title="Efetua alteração do registro informado na linha"><i class="cor-1 large material-icons">delete_forever</i></a></td>';
          $txt .= '<td class="text-center">' . $lin['idsugestao'] . '</td>';
          if ($lin['sugstatus'] == 0) {$txt .= "<td>" . "Normal" . "</td>";}
          if ($lin['sugstatus'] == 1) {$txt .= "<td>" . "Bloqueado" . "</td>";}
          if ($lin['sugstatus'] == 2) {$txt .= "<td>" . "Suspenso" . "</td>";}
          if ($lin['sugstatus'] == 3) {$txt .= "<td>" . "Cancelado" . "</td>";}
          if ($lin['sugtipo'] == 0) {
               $txt .= '<td>' . '******************************' . '</td>';
          } else {
               $txt .= '<td>' . retorna_dad('funnome', 'tb_funcionario', 'idfuncionario', $lin['sugfuncionario']) . '</td>';
          }     
          $txt .= '<td>' . $lin['sugtitulo'] . '</td>';
          $txt .= '<td>' . $lin['sugdescricao'] . '</td>';
          $txt .= '<td class="text-center">' . date('d/m/Y H:i:s', strtotime($lin['datinc'])) . '</td>';
          if ($lin['datalt']  == null) {
               $txt .= '<td>' . '' . '</td>';
          } else {
               $txt .= '<td class="text-center">' . date('d/m/Y H:i:s', strtotime($lin['datalt'])) . '</td>';
          }
          $txt .= "</tr>";
          echo $txt;
     }
     return $ret;
}

function incluir_sug() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "insert into tb_sugestao (";
     $sql .= "sugstatus, ";
     $sql .= "sugtitulo, ";
     $sql .= "sugfuncionario, ";
     $sql .= "sugdescricao, ";
     $sql .= "sugtipo, ";
     $sql .= "keyinc, ";
     $sql .= "datinc ";
     $sql .= ") value ( ";
     $sql .= "'" . $_REQUEST['sta'] . "',";
     $sql .= "'" . trim($_REQUEST['tit']) . "',";
     $sql .= "'" . $_SESSION['wrkideusu'] . "',";
     $sql .= "'" . trim($_REQUEST['des']) . "',";
     $sql .= "'" . (isset($_REQUEST['ide']) == false ? 0 : 1) . "',";
     $sql .= "'" . $_SESSION['wrkideusu'] . "',";
     $sql .= "'" . date("Y/m/d H:i:s") . "')";
     $ret = comando_tab($sql, $nro, $ult, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na gravação do registro solicitado !");</script>';
     }
     return $ret;
 }

 function alterar_sug() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "update tb_sugestao set ";
     $sql .= "sugstatus = '". $_REQUEST['sta'] . "', ";
     $sql .= "sugdescricao = '". trim($_REQUEST['des']) . "', ";
     $sql .= "sugtitulo = '". trim($_REQUEST['tit']) . "', ";
     $sql .= "sugtipo = '". (isset($_REQUEST['ide']) == false ? 0 : 1) . "', ";
     $sql .= "keyalt = '" . $_SESSION['wrkideusu'] . "', ";
     $sql .= "datalt = '" . date("Y/m/d H:i:s") . "' ";
     $sql .= "where idsugestao = " . $_SESSION['wrkcodreg'];
     $ret = comando_tab($sql, $nro, $ult, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na regravação do registro solicitado !");</script>';
     }
     return $ret;
}

function excluir_sug() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "Delete from tb_sugestao where idsugestao = " . $_SESSION['wrkcodreg'] ;
     $ret = comando_tab($sql, $nro, $cha, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na exclusão do registro solicitado !");</script>';
     }
     return $ret;
}

function envia_ema($asu, $men, $nom) {
     $ret = 0; $txt = ""; 
     $ema = retorna_dad('empemail', 'tb_empresa', 'idempresa', 1);
     if (isset($_REQUEST['ide']) == false) { $nom = "(Emissor da mensagem não identificado !)"; }
     if ($ema != "") {
          $txt  = '<!DOCTYPE html>';
          $txt .= '<html lang="pt_br">';
          $txt .= '<head>';
          $txt .= '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />';
          $txt .= '<title>PegaNet - Gerenciamento de Colaboradores</title>';
          $txt .= '<style type="text/css">';
          $txt .= '.qua-a0 { text-align: center; border: 0.5px solid #929090; border-radius: 20px; background-color: #fcf2db; }';
          $txt .= '.qua-a1 { color: #ffffff; background-color: #DA1711; font-size: 18px;  font-weight: bold;}';
          $txt .= '.qua-a2 { font-size: 16px; font-weight: bold; }';
          $txt .= '</style>';
     
          $txt .= '</head>';
          $txt .= '<body class="qua-a0">'; 
          $txt .= '<a href="https://peganet.com.br/">';
          $txt .= '<p>&nbsp;</p>';
          $txt .= '<img src="https://www.profsa.com.br/pallas56/img/logo-03.png"></p></a>';
          $txt .= '<p class="qua-a1">' . $asu . '</p>';
          $txt .= '<p>&nbsp;</p>';
          $txt .= '<div class="qua-a2">' . $men . '</div>';
          $txt .= '<p align="center"><font size="4" face="Verdana"><a href="https://peganet.com.br/">';
          $txt .= 'www.peganet.com.br</a></font></p>';
          $txt .= '<p>&nbsp;</p>';
          $txt .= '</body>';
          $txt .= '</html>';

          $ret = manda_email($ema, "Envio de Dica, Sugestão ou Ouvidoria via sistema PegaNet", $txt, $nom, '', '');

          if ($ret == 1) {
               $ret = gravar_log(15,"Envio de Dica ou Sugestão enviada para " . $ema);
          }
     }
     return $ret;
}
?>

</html>