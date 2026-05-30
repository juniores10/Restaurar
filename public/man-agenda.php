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

     <script type="text/javascript" src="js/jquery.mask.min.js"></script>

     <script type="text/javascript" src="js/datepicker-pt-BR.js"></script>

     <link href="css/pallas56.css" rel="stylesheet" type="text/css" media="screen" />
     <title>Agenda - Gerenciamento de Colaboradores</title>
</head>

<script>
     $(function() {
     $("#hor").mask("00:00");
     $("#dat").mask("00/00/0000");
     $("#dat").datepicker($.datepicker.regional["pt-BR"]);
});

$(document).ready(function() {
     if (localStorage.age_f == undefined) {
          $('#tel_c').hide();
          localStorage.setItem('age_f', 1);
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
               "infoEmpty": "Sem registros de agendamento ...",
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

     $("#dat").blur(function() {
          if ($("#dat").val() == "") {
               var dat = new Date;
               var ddd = ('0' + dat.getDate()).slice(-2);
               var mmm = ('0' + (dat.getMonth() + 1)).slice(-2);
               var aaa = dat.getFullYear();
               dat = ddd + "/" + mmm + "/" + (parseFloat(aaa, 10) + 5);
               $('#dat').val(dat);
          }
     });

     $("#des").blur(function() {
          if ($("#des").val() == "") {
               $('#des').val($('#tit').val());
          }
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
          $per = ' onclick="return confirm(\'Confirma exclusão de agenda informada em tela ?\')" ';
     }  

     if ($_SESSION['wrkopereg'] == 2 || $_SESSION['wrkopereg'] == 3) {
          if (isset($_REQUEST['salvar']) == false) { 
               $cha = $_SESSION['wrkcodreg']; $_SESSION['wrknumcha'] = $_SESSION['wrkcodreg']; 
               $ret = ler_agenda($_SESSION['wrkcodreg']); 
          }
     }

     if (isset($_REQUEST['salvar']) == true) {
          if ($_SESSION['wrkopereg'] == 1) {
               $ret = consiste_age();
               if ($ret == 0) {
                    $ret = incluir_age();
                    $ret = gravar_log(11,"Inclusão de nova agenda: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
                    exit('<script>location.href = "man-agenda.php?ope=1&cod=0"</script>'); 
               }
          }
          if ($_SESSION['wrkopereg'] == 2) {
               $ret = consiste_age();
               if ($ret == 0) {
                    $ret = alterar_age();
                    $ret = gravar_log(12,"Alteração de agenda existente: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
                    exit('<script>location.href = "man-agenda.php?ope=1&cod=0"</script>'); 
               }
          }
          if ($_SESSION['wrkopereg'] == 3) {
               $ret = excluir_age();
               $ret = gravar_log(13,"Exclusão de agenda existente: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
               exit('<script>location.href = "man-agenda.php?ope=1&cod=0"</script>'); 
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
                              <h3 class="cor-4"><strong>Manutenção de Agenda</strong></h3>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="mos_t" href="#"
                                   title="Mostra e esconde a página detalhada com os dados de agenda para edição.">
                                   <i class="fa fa-eye fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                         <div class="col-md-1 text-center">
                              <a href="man-agenda.php?ope=1&cod=0"
                                   title="Abre página para adicionar (criar) mais uma agenda dentro do sistema.">
                                   <i class="fa fa-plus-circle fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                    </div>
                    <br />
                    <form class="qua-2" id="tel_c" name="frmTelMan" action="man-agenda.php" method="POST">
                         <div class="row">
                              <div class="col-md-2">
                                   <label>Código</label>
                                   <input type="text" class="form-control text-center" maxlength="6" id="cod" name="cod"
                                        value="<?php echo $_SESSION['wrkcodreg']; ?>" disabled />
                              </div>
                              <div class="col-md-8">
                                   <label>Nome do Funcionário</label>
                                   <select id="fun" name="fun" class="form-control">
                                        <?php $ret = carrega_fun(); ?>
                                   </select>
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
                              <div class="col-md-8">
                                   <label>Título para o Agendamento</label>
                                   <input type="text" class="form-control" maxlength="50" id="tit" name="tit"
                                        value="<?php echo (isset($_REQUEST['tit']) == false ? "" : $_REQUEST['tit']); ?>"
                                        required />
                              </div>
                              <div class="col-md-2">
                                   <label>Data do Agendamento</label>
                                   <input type="text" class="form-control text-center" maxlength="15" id="dat" name="dat"
                                        value="<?php echo (isset($_REQUEST['dat']) == false ? "" : $_REQUEST['dat']); ?>"
                                        required />
                              </div>
                              <div class="col-md-2">
                                   <label>Hora do Agendamento</label>
                                   <input type="text" class="form-control text-center" maxlength="5" id="hor" name="hor"
                                        value="<?php echo (isset($_REQUEST['hor']) == false ? "" : $_REQUEST['hor']); ?>"
                                        required />
                              </div>
                         </div>
                         <div class="row">
                              <div class="col-md-12">
                                   <label>Descrição Detalhada do Agendamento</label>
                                   <input type="text" class="form-control" maxlength="750" id="des" name="des"
                                        value="<?php echo (isset($_REQUEST['des']) == false ? "" : $_REQUEST['des']); ?>"
                                        required />
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
                                                  <th>Título do Agendamento</th>
                                                  <th>Detalhamento do Agendamento</th>
                                                  <th class="text-center">Agendamento</th>
                                                  <th class="text-center">Inclusão</th>
                                                  <th class="text-center">Alteração</th>
                                             </tr>
                                        </thead>
                                        <tbody>
                                             <?php $ret = carrega_age();  ?>
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
     $nro = acessa_reg('Select idagenda from tb_agenda order by idagenda desc Limit 1', $reg);
     if ($nro == 1) {
          $cod = $reg['idagenda'] + 1;
     }        
     return $cod;
}

function consiste_age() {
     $sta = 0;
     if (trim($_REQUEST['tit']) == "") {
          echo '<script>alert("Título da Agenda não pode estar em branco");</script>';
          return 1;
     }
     if (trim($_REQUEST['des']) == "") {
          echo '<script>alert("Descrição da Agenda não pode estar em branco");</script>';
          return 1;
     }
     if (trim($_REQUEST['fun']) == "" || trim($_REQUEST['fun']) == "0") {
          echo '<script>alert("Código do Funcionário não pode estar em branco");</script>';
          return 1;
     }
     if (trim($_REQUEST['dat']) != "") {
          if (valida_dat($_REQUEST['dat']) != 0) {
               echo '<script>alert("Data de Agendamento informada não é valida");</script>';
               return 1;
          }
     }
     if (trim($_REQUEST['hor']) != "") {
          if (valida_hor($_REQUEST['hor']) != 0) {
               echo '<script>alert("Hora do Agendamento informada não é valida");</script>';
               return 1;
          }
     }
     return $sta;
}

function ler_agenda(&$cha) {
     include_once "dados.php";
     $nro = acessa_reg('Select * from tb_agenda where idagenda = ' . $cha, $reg);
     if ($nro == 0 || $reg == false) {
          echo '<script>alert("Código do Cargo informada não cadastrada");</script>';
          $nro = 1;
     } else {
          $_REQUEST['sta'] = $reg['agestatus'];
          $_REQUEST['tit'] = $reg['agetitulo'];
          $_REQUEST['fun'] = $reg['agefuncionario'];
          $_REQUEST['des'] = $reg['agedescricao'];
          $_REQUEST['dat'] = date('d/m/Y', strtotime($reg['agedatahor'])); 
          $_REQUEST['hor'] = date('H:i', strtotime($reg['agedatahor'])); 
     }
     return $cha;
}

function carrega_age() {
     $ret = 0;
     include_once "dados.php";
     $com = "Select * from tb_agenda order by agefuncionario, agedatahor";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          if (date('Y-m-d', strtotime($lin['agedatahor'])) >= date('Y-m-d')) {
               $txt =  '<tr>';
          } else {
               $txt =  '<tr class="cor-1">';
          }
          $txt .= '<td class="text-center"><a href="man-agenda.php?ope=2&cod=' . $lin['idagenda'] . '" title="Efetua alteração do registro informado na linha"><i class="large material-icons">healing</i></a></td>';
          $txt .= '<td class="text-center"><a href="man-agenda.php?ope=3&cod=' . $lin['idagenda'] . '" title="Efetua alteração do registro informado na linha"><i class="cor-1 large material-icons">delete_forever</i></a></td>';
          $txt .= '<td class="text-center">' . $lin['idagenda'] . '</td>';
          if ($lin['agestatus'] == 0) {$txt .= "<td>" . "Normal" . "</td>";}
          if ($lin['agestatus'] == 1) {$txt .= "<td>" . "Bloqueado" . "</td>";}
          if ($lin['agestatus'] == 2) {$txt .= "<td>" . "Suspenso" . "</td>";}
          if ($lin['agestatus'] == 3) {$txt .= "<td>" . "Cancelado" . "</td>";}
          $txt .= '<td>' . retorna_dad('funnome', 'tb_funcionario', 'idfuncionario', $lin['agefuncionario']) . '</td>';
          $txt .= '<td>' . $lin['agetitulo'] . '</td>';
          $txt .= '<td>' . $lin['agedescricao'] . '</td>';
          $txt .= '<td class="text-center">' . date('d/m/Y H:i', strtotime($lin['agedatahor'])) . '</td>';
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

function carrega_fun() {
     $sta = 0;
     include_once "dados.php";    
     $fun = (isset($_REQUEST['fun']) == false ? "" : $_REQUEST['fun']);
     echo '<option value="0" selected="selected">Selecione funcionário desejado ...</option>';
     $com = "Select idfuncionario, funnome from tb_funcionario order by funnome, idfuncionario";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          if ($lin['idfuncionario'] != $fun) {
               echo  '<option value ="' . $lin['idfuncionario'] . '">' . $lin['funnome'] . '</option>'; 
          } else {
               echo  '<option value ="' . $lin['idfuncionario'] . '" selected="selected">' . $lin['funnome'] . '</option>';
          }
     }
     return $sta;
}

function incluir_age() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "insert into tb_agenda (";
     $sql .= "agestatus, ";
     $sql .= "agetitulo, ";
     $sql .= "agedescricao, ";
     $sql .= "agefuncionario, ";
     $sql .= "agedatahor, ";
     $sql .= "keyinc, ";
     $sql .= "datinc ";
     $sql .= ") value ( ";
     $sql .= "'" . $_REQUEST['sta'] . "',";
     $sql .= "'" . trim($_REQUEST['tit']) . "',";
     $sql .= "'" . trim($_REQUEST['des']) . "',";
     $sql .= "'" . trim($_REQUEST['fun']) . "',";
     $sql .= "'" . inverte_dat(1, $_REQUEST['dat']) . " " . $_REQUEST['hor'] . ":00',";
     $sql .= "'" . $_SESSION['wrkideusu'] . "',";
     $sql .= "'" . date("Y/m/d H:i:s") . "')";
     $ret = comando_tab($sql, $nro, $ult, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na gravação do registro solicitado !");</script>';
     }
     return $ret;
 }

 function alterar_age() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "update tb_agenda set ";
     $sql .= "agestatus = '". $_REQUEST['sta'] . "', ";
     $sql .= "agefuncionario = '". $_REQUEST['fun'] . "', ";
     $sql .= "agedatahor = '". inverte_dat(1, $_REQUEST['dat']) . " " . $_REQUEST['hor'] . ":00', ";
     $sql .= "agedescricao = '". trim($_REQUEST['des']) . "', ";
     $sql .= "agetitulo = '". trim($_REQUEST['tit']) . "', ";
     $sql .= "keyalt = '" . $_SESSION['wrkideusu'] . "', ";
     $sql .= "datalt = '" . date("Y/m/d H:i:s") . "' ";
     $sql .= "where idagenda = " . $_SESSION['wrkcodreg'];
     $ret = comando_tab($sql, $nro, $ult, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na regravação do registro solicitado !");</script>';
     }
     return $ret;
}

function excluir_age() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "Delete from tb_agenda where idagenda = " . $_SESSION['wrkcodreg'] ;
     $ret = comando_tab($sql, $nro, $cha, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na exclusão do registro solicitado !");</script>';
     }
     return $ret;
}

?>

</html>