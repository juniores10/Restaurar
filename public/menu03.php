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

     <script src="https://cdn.jsdelivr.net/npm/sweetalert2@8/dist/sweetalert2.min.js"></script>
     <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@8/dist/sweetalert2.min.css"
          id="theme-styles">

     <link href="css/pallas56.css" rel="stylesheet" type="text/css" media="screen" />
     <title>PegaNet Provedor de Internet</title>
</head>

<script>
$(document).ready(function() {

     $('#mes_t').hide();

     var alt = $(window).height();
     var lar = $(window).width();

     let ret = carrega_qua($("#dat_e").val());
     ret = carrega_nov($("#dat_e").val());

     $("#dat_e").change(function() {
          if ($('#opc_e').prop("checked") == true) {
               let ret = carrega_esc($("#dat_e").val());
          } else if($('#opc_p').prop("checked")) {
               $('#sal_i').html('');
               $('#sal_f').html('');
               $('#mes_t').fadeIn();
               $('#lis_o').fadeOut();
               let ret = carrega_pro(1, $("#dat_e").val());
          } else if($('#opc_s').prop("checked")) {
               $('#sal_i').html('');
               $('#sal_f').html('');
               $('#mes_t').fadeIn();
               $('#lis_o').fadeOut();
               let ret = carrega_pro(2, $("#dat_e").val());
          } else {
               let ret = carrega_ban($("#dat_e").val());
          }
     });

     $("#opc_b").click(function() {
          if (($('#opc_b').prop("checked")) == true) {
               $('#mes_t').fadeIn();
               $('#lis_o').fadeOut();
               let ret = carrega_ban($("#dat_e").val());
          }
     });

     $("#opc_d").click(function() {
          if (($('#opc_d').prop("checked")) == true) {
               $('#sal_i').html('');
               $('#sal_f').html('');
               $('#mes_t').fadeOut();
               $('#lis_o').fadeIn();
               let ret = carrega_doc($("#dat_e").val());
          }
     });

     $("#opc_e").click(function() {
          if (($('#opc_e').prop("checked")) == true) {
               $('#sal_i').html('');
               $('#sal_f').html('');
               $('#mes_t').fadeIn();
               $('#lis_o').fadeOut();
               let ret = carrega_esc($("#dat_e").val());
          }
     });

     $("#opc_p").click(function() {
          if (($('#opc_p').prop("checked")) == true) {
               $('#sal_i').html('');
               $('#sal_f').html('');
               $('#mes_t').fadeIn();
               $('#lis_o').fadeOut();
               let ret = carrega_pro(1, $("#dat_e").val());
          }
     });

     $("#opc_s").click(function() {
          if (($('#opc_s').prop("checked")) == true) {
               $('#sal_i').html('');
               $('#sal_f').html('');
               $('#mes_t').fadeIn();
               $('#lis_o').fadeOut();
               let ret = carrega_pro(2, $("#dat_e").val());
          }
     });

     $("#opc_q").click(function() {
          if (($('#opc_q').prop("checked")) == true) {
               $('#sal_i').html('');
               $('#sal_f').html('');
               $('#mes_t').fadeOut();
               $('#lis_o').fadeIn();
               let ret = carrega_qua($("#dat_e").val());
          }
     });

     $("#esc_p").click(function() {
          if (($('#opc_d').prop("checked")) == true) {
               let ret = carrega_doc($("#dat_e").val());
          }
          if (($('#opc_e').prop("checked")) == true) {
               let ret = carrega_esc($("#dat_e").val());
          }
          if (($('#opc_b').prop("checked")) == true) {
               let ret = carrega_ban($("#dat_e").val());
          }
          if (($('#opc_p').prop("checked")) == true) {
               let ret = carrega_pro(1, $("#dat_e").val());
          }
          if (($('#opc_s').prop("checked")) == true) {
               let ret = carrega_pro(2, $("#dat_e").val());
          }
          if (($('#opc_q').prop("checked")) == true) {
               let ret = carrega_qua($("#dat_e").val());
          }
     });

     $("#esc_s").click(function() {
          if (($('#opc_d').prop("checked")) == true) {
               let ret = carrega_doc($("#dat_e").val());
          }
          if (($('#opc_q').prop("checked")) == true) {
               let ret = carrega_qua($("#dat_e").val());
          }
     });

     $("#esc_f").click(function() {
          if (($('#opc_d').prop("checked")) == true) {
               let ret = carrega_doc($("#dat_e").val());
          }
          if (($('#opc_q').prop("checked")) == true) {
               let ret = carrega_qua($("#dat_e").val());
          }
     });

     $("#esc_g").click(function() {
          if (($('#opc_d').prop("checked")) == true) {
               let ret = carrega_doc($("#dat_e").val());
          }
          if (($('#opc_q').prop("checked")) == true) {
               let ret = carrega_qua($("#dat_e").val());
          }
     });

     $("form").on("click", ".docto", function() {
          var lar = $(window).width();
          var cam = $(this).attr("cam");
          if (lar < 750) {
               $('#lit_a').show();
               $('#doc-p').attr('src', '');
               $('#doc-p').attr('height', 5);
          } else {
               $('#lit_a').hide();
               $('#doc-p').attr('src', cam);
               $('#doc-p').attr('height', 750);
          }
          $('#cam_d').val(cam);
          $('#mos_a').hide();
          $('#ass_d').hide();
          $('#doc-pdf').modal('show');
     });

     $("form").on("click", ".assina", function() {
          var lar = $(window).width();
          if ($('#ass_o').val() != 3) {
               swal.fire("Assinatura Inválida", "Você não possue assinatura aprovada, lamento !",
                    "error");
          } else {
               var cam = $(this).attr("cam");
               var cod = $(this).attr("cod");
               if (lar < 750) {
                    $('#lit_a').show();
                    $('#doc-p').attr('src', '');
                    $('#doc-p').attr('height', 5);
               } else {
                    $('#lit_a').hide();
                    $('#doc-p').attr('src', cam);
                    $('#doc-p').attr('height', 750);
               }
               $('#cam_d').val(cam);
               $('#mos_a').show();
               $('#ass_d').show();
               $('#ass_c').val(cod);
               $('#doc-pdf').modal('show');
          }
     });

     $("form").on("click", ".texto", function() {
          var cod = $(this).attr("cod");
          $.getJSON("ajax/avi-car-texto.php", {
                    cod: cod
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#qua_a').html(data.txt);
                         $('#tel-avi').text('Quadro de Avisos - ' + data.dat);
                         $('#qua-avi').modal('show');
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de texto do quadro");
                    $.get("ajax/err-env-email.php", {
                         erro: JSON.stringify(data),
                    });
               });
     });

     $("#ani_m").click(function() {
          $.getJSON("ajax/men-mes-niver.php", {
                    tip: 0
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#tel-esc').html(
                              'Nossos Aniversariantes - Feliz Aniversário a Todos <i class="fa fa-birthday-cake fa-1g" aria-hidden="true"></i></i>'
                         );
                         $('#dad-e').html(data.txt);
                         $('#dad-esc').modal('show');
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de dados de aniversariantes do mês");
                    $.get("ajax/err-env-email.php", {
                         erro: JSON.stringify(data),
                    });
               });
     });

     $("#age_m").click(function() {
          $.getJSON("ajax/men-mos-agenda.php", {
                    tip: 0
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#tel-esc').html('Agendamentos para os próximos dias');
                         $('#dad-e').html(data.txt);
                         $('#dad-esc').modal('show');
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de dados da agenda");
                    $.get("ajax/err-env-email.php", {
                         erro: JSON.stringify(data),
                    });
               });
     });

     $("#dic_m").click(function() {
          $('#dig-dic').modal('show');
     });

     $("#fec_p").click(function() {
          location.href = "fechar.php";
     });

     $("#gra_d").click(function() {
          $.getJSON("ajax/cel-gra-sugestao.php", {
                    tit: $('#tit').val(),
                    obs: $('#obs').val(),
                    sim: $("#ide_s").prop("checked"),
                    nao: $("#ide_n").prop("checked"),
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#tit').val('');
                         $('#obs').val('');
                         $("#ide").prop("checked", false);
                         $('#dig-dic').modal('hide');
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no processamento de gravação de sugestão");
                    $.get("ajax/err-env-email.php", {
                         erro: JSON.stringify(data),
                    });
               });
     });

     $('#ass_f').bind("click", function() {
          $('#doc_j').click();
     });

     $('#doc_j').change(function() {
          var cam = $('#doc_j').val();
          fot_f = new FormData();
          fot_f.append('arq-ass', $('#doc_j').prop('files')[0]);
          $.ajax({
               url: 'ajax/fun-ass-funcionario.php?cam=' + cam,
               data: fot_f,
               dataType: 'json',
               processData: false,
               contentType: false,
               type: 'POST',
               success: function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         swal.fire("Upload efetuado !",
                              "Assinatura informada com sucesso", "success");
                    }
               },
               error: function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert(
                         "Erro ocorrido no processamento de Upload de foto de funcionário"
                    );
                    $.get("ajax/err-env-email.php", {
                         erro: JSON.stringify(data),
                    });
               }
          });
     });

     $('#doc_f').bind("click", function() {
          $('#dad-doc').modal('show');
     });

     $("#upl_d").click(function() {
          if ($('#des_d').val() == "") {
               swal.fire("Dado Inválido", "Descrição do documento não pode ficar em branco !",
                    "error");
          } else {
               $('#dct_j').click();
          }
     });

     $('#dct_j').change(function() {
          var cam = $('#dct_j').val();
          fot_f = new FormData();
          fot_f.append('arq-doc', $('#dct_j').prop('files')[0]);
          $.ajax({
               url: 'ajax/fun-doc-funcionario.php?cam=' + cam + '&des=' + $('#des_d')
                    .val() + '&set=' + '0',
               data: fot_f,
               dataType: 'json',
               processData: false,
               contentType: false,
               type: 'POST',
               success: function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         swal.fire("Upload efetuado !",
                              "Documento informado com sucesso", "success");
                         $('#des_d').val('');
                         $('#dad-doc').modal('hide');
                    }
               },
               error: function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert(
                         "Erro ocorrido no processamento de Upload de docto do funcionário"
                    );
                    $.get("ajax/err-env-email.php", {
                         erro: JSON.stringify(data),
                    });
               }
          });
     });

     $("#ass_d").click(function() {
          if ($('#opc_a').prop('checked') == false) {
               swal.fire("Marcação Inválida",
                    "Você não marcou a caixa de Assinatura do documento !",
                    "error");
          } else {
               $.getJSON("ajax/fun-ass-docto.php", {
                         cod: $('#ass_c').val()
                    })
                    .done(function(data) {
                         if (data.men != "") {
                              alert(data.men);
                         } else {
                              $('#ass_c').val(0);
                              $('#doc-pdf').modal('hide');
                              $('#opc_a').prop('checked', false);
                         }
                    }).fail(function(data) {
                         console.log('Erro: ' + JSON.stringify(data));
                         alert(
                              "Erro ocorrido no processo de assinatura do documento solicitado"
                         );
                         $.get("ajax/err-env-email.php", {
                              erro: JSON.stringify(data),
                         });
                    });
          }
     });

     $("#bot_a").click(function() {
          window.open($('#cam_d').val(), '_blank');
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

     function carrega_esc(dat) {
          let ret = 0;
          $.getJSON("ajax/cel-car-escala.php", {
                    dat: dat
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#sal_i').html('');
                         $('#sal_f').html('');
                         $('#lis_f').html(data.txt);
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de escala de trabalho do funcionário");
                    $.get("ajax/err-env-email.php", {
                         erro: JSON.stringify(data),
                    });
               });
          return ret;
     }

     function carrega_ban(dat) {
          let ret = 0;
          let opc = $("#esc_p").prop("checked") + "|" + $("#esc_s").prop("checked") + "|" + $("#esc_f").prop(
               "checked") + "|" + $("#esc_g").prop("checked");
          $.getJSON("ajax/cel-car-banco.php", {
                    dat: dat,
                    opc: opc
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#lis_f').html(data.txt);
                         $('#sal_i').html('<br />Saldo Anterior: ' + data.ant);
                         $('#sal_f').html('<br />Saldo Atual: ' + data.atu);
                         if (data.avi != "") {
                              swal.fire("Assinatura inválida !", data.avi, "error");
                         }
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de banco de horas do funcionário");
                    $.get("ajax/err-env-email.php", {
                         erro: JSON.stringify(data),
                    });
               });
          return ret;
     }

     function carrega_doc(dat) {
          let ret = 0;
          let opc = $("#esc_p").prop("checked") + "|" + $("#esc_s").prop("checked") + "|" + $("#esc_f").prop(
               "checked") + "|" + $("#esc_g").prop("checked");
          $.getJSON("ajax/cel-car-docto.php", {
                    dat: dat,
                    opc: opc
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#lis_f').html(data.txt);
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de documentos do funcionário");
                    $.get("ajax/err-env-email.php", {
                         erro: JSON.stringify(data),
                    });
               });
          return ret;
     }

     function carrega_pro(tip, dat) {
          let ret = 0;
          $('.ima-4').css("display", "block");
          let opc = $("#esc_p").prop("checked") + "|" + $("#esc_s").prop("checked") + "|" + $("#esc_f").prop(
               "checked") + "|" + $("#esc_g").prop("checked");
          $.getJSON("ajax/cel-car-producao.php", {
                    tip: tip,
                    dat: dat,
                    opc: opc
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#lis_f').html(data.txt);
                         $('.ima-4').css("display", "none");
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de produtividade");
                    $.get("ajax/err-env-email.php", {
                         erro: JSON.stringify(data),
                    });
               });
          return ret;
     }

     function carrega_qua(dat) {
          let ret = 0;
          let opc = $("#esc_p").prop("checked") + "|" + $("#esc_s").prop("checked") + "|" + $("#esc_f").prop(
               "checked") + "|" + $("#esc_g").prop("checked");
          $.getJSON("ajax/cel-car-quadro.php", {
                    dat: dat,
                    opc: opc
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#lis_f').html(data.txt);
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de quadro de aviso");
                    $.get("ajax/err-env-email.php", {
                         erro: JSON.stringify(data),
                    });
               });
          return ret;
     }

     function carrega_nov(dat) {
          let ret = 0;
          $.getJSON("ajax/cel-car-novos.php", {
                    dat: dat,
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         if (data.avi != 0) {
                              swal.fire("Atenção ! Visualize Dados !", "Você tem " + data.avi +
                                   " novas mensagens e/ou avisos da PegaNet !", "warning");
                         }
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de novos avisos e doctos");
                    $.get("ajax/err-env-email.php", {
                         erro: JSON.stringify(data),
                    });
               });
          return ret;
     }

});
</script>

<?php
     $ret = 0; 
     include_once "dados.php";
     include_once "profsa.php";
     date_default_timezone_set("America/Sao_Paulo");
     $_SESSION['wrkendser'] = getenv("REMOTE_ADDR");

     if (isset($_SESSION['wrknomusu']) == false) {
          exit('<script>location.href = "index.php"</script>');   
     } elseif ($_SESSION['wrknomusu'] == "") {
          exit('<script>location.href = "index.php"</script>');   
     } elseif ($_SESSION['wrknomusu'] == "*") {
          exit('<script>location.href = "index.php"</script>');   
     } elseif ($_SESSION['wrknomusu'] == "#") {
          exit('<script>location.href = "index.php"</script>');   
     }  

     $dti = date('Y-m-d', strtotime('-8 days'));
     $dtf = date('Y-m-d', strtotime('-1 days'));

     $ass_f = existe_ass( $_SESSION['wrkideusu']);

?>

<body id="box00">
     <h1 class="cab-0">Gerenciamento de Colaboradores - By Profsa</h1>
     <br />
     <form id="frmTelMob" name="frmTelMob" action="menu03.php" method="POST">
          <div class="bor-1 container mobile">
               <div class="qua-5">
                    <div class="row">
                         <div class="col-2"></div>
                         <div class="col-8 text-center">
                              <img class="img-fluid" src="img/logo-07.png" />
                         </div>
                         <div class="col-2 text-right">
                              <i id="fec_p" class="cur-1 cor-1 fa fa-sign-out fa-2x" aria-hidden="true"
                                   title="Click nesse botão fecha a página atual e encerra sistema Pallas.56."></i>
                              <br />
                              <span class="cor-1 lit-9">Saída &nbsp; &nbsp; &nbsp; </span>
                         </div>
                    </div>
                    <br />
                    <div class="row">
                         <div class="col-5 text-right">
                              <img class="ima-1 img-fluid" src="<?php echo $_SESSION['wrkfotusu']; ?>" />
                         </div>
                         <div class="col-5 text-center">
                              <div><strong><?php echo $_SESSION['wrknomusu']; ?></strong></div>
                              <div class="tit-3"><?php echo date('d/m/Y H:i:s'); ?></div>
                              <div class="tit-3"><?php echo $_SESSION['wrkemausu']; ?></div>
                         </div>
                         <div class="col-2"></div>
                    </div>
               </div>
               <br />
               <div class="row text-center">
                    <div class="col-1"></div>
                    <div class="col-2">
                         <i id="ani_m" class="cur-1 cor-4 fa fa-birthday-cake fa-2x" aria-hidden="true"
                              title="Abre página para visualizar os aniversariantes do mês e do próximo."></i>
                         <br />
                         <span class="lit-9">Aniversariantes do Mês</span>
                    </div>
                    <div class="col-2">
                         <i id="age_m" class="cur-1 cor-4 fa fa-calendar fa-2x" aria-hidden="true"
                              title="Abre página para visualizar a agenda do funcionário para os próximos meses."></i>
                         <br />
                         <span class="lit-9">Minha Agenda</span>
                    </div>
                    <div class="col-2">
                         <i id="dic_m" class="cur-1 cor-4 fa fa-bullhorn fa-2x" aria-hidden="true"
                              title="Abre modal para o funcionário informar uma dica ou sugestão para os gestores."></i>
                         <br />
                         <span class="lit-9">Dicas e Sugestões</span>
                    </div>
                    <div class="col-2">
                         <i id="doc_f" class="cur-1 cor-4 fa fa-upload fa-2x" aria-hidden="true"
                              title="Abre janela para informar arquivo de documento para efetuar Upload de um documento para a empresa."></i>
                         <br />
                         <span class="lit-9">Enviar Documento</span>
                    </div>
                    <div class="col-2">
                         <i id="ass_f" class="cur-1 cor-4 fa fa-pencil-square-o fa-2x" aria-hidden="true"
                              title="Abre janela para informar arquivo de imagem com a assinatura do colaborador."></i>
                         <br />
                         <span class="lit-9">Cadastrar minha Assinatura</span>
                    </div>
                    <div class="col-1"></div>
               </div>
               <hr />
               <div class="row">
                    <div class="col-md-2 text-center">
                         <div id="sal_i" class="cor-1 lit-5"></div>
                    </div>
                    <div class="col-md-2"></div>
                    <div class="col-md-4 text-center">
                         <div id="mes_t">
                              <label><strong>Mês de Trabalho</strong></label>
                              <select id="dat_e" name="dat_e" class="form-control text-center">
                                   <?php
                                   for ($ind = 1; $ind < 13; $ind++) {
                                        if ($ind != date('m')) {
                                             echo '<option value="' . str_pad($ind, 2, "0", STR_PAD_LEFT) . '-' . date('Y'). '">' .  mes_ano($ind) . '/' . date('Y'). '</option>';
                                        } else {
                                             echo '<option value="' . str_pad($ind, 2, "0", STR_PAD_LEFT) . '-' . date('Y'). '" selected="selected">' .  mes_ano($ind) . '/' . date('Y'). '</option>';
                                        }
                                   }
                                   ?>
                              </select>
                         </div>
                    </div>
                    <div class="col-md-2"></div>
                    <div class="col-md-2 text-center">
                         <div id="sal_f" class="cor-1 lit-5"></div>
                    </div>
               </div>
               <br />
               <div class="row opc-1 text-center">
                    <div class="col-sm-3"></div>
                    <div class="col-sm-3">
                         <input type="radio" id="opc_q" name="opc_l" value="1" checked="checked" /><span
                              class="cor-4 lit-7"><br />Quadro de Avisos </span>
                    </div>
                    <div class="col-sm-3">
                         <input type="radio" id="opc_d" name="opc_l" value="1" /><span class="cor-4 lit-7"><br />Meus
                              Documentos</span>
                    </div>
                    <div class="col-sm-3"></div>
               </div>
               <br />
               <div class="row opc-1 text-center">
                    <div class="col-sm-3">
                         <input type="radio" id="opc_e" name="opc_l" value="2" /><span class="cor-4 lit-7"><br />Escala
                              de
                              Horário </span>
                    </div>
                    <div class="col-sm-3">
                         <input type="radio" id="opc_b" name="opc_l" value="1" /><span class="cor-4 lit-7"><br />Banco
                              de
                              Horas </span>
                    </div>
                    <div class="col-sm-3">
                         <input type="radio" id="opc_p" name="opc_l" value="1" /><span
                              class="cor-4 lit-7"><br />Produtividade do Setor</span>
                    </div>
                    <div class="col-sm-3">
                         <input type="radio" id="opc_s" name="opc_l" value="1" /><span class="cor-4 lit-7"><br />Ranking Produtividade</span>
                    </div>
               </div>

               <div id="lin_e">
                    <hr />
                    <div id="lis_o">
                         <div class="row opc-1 text-center">
                              <div class="col-md-2"></div>
                              <div class="col-md-2">
                                   <input type="radio" id="esc_p" name="opc_v" value="1" checked /><span
                                        class="cor-4 lit-7">
                                        Pessoal </span>
                              </div>
                              <div class="col-md-2">
                                   <input type="radio" id="esc_s" name="opc_v" value="1" /><span class="cor-4 lit-7">
                                        Setor
                                   </span>
                              </div>
                              <div class="col-md-2">
                                   <input type="radio" id="esc_f" name="opc_v" value="1" /><span class="cor-4 lit-7">
                                        Função
                                   </span>
                              </div>
                              <div class="col-md-2">
                                   <input type="radio" id="esc_g" name="opc_v" value="1" /><span class="cor-4 lit-7">
                                        Geral
                                   </span>
                              </div>
                              <div class="col-md-2"></div>
                         </div>
                    </div>
               </div>
               <div id="lis_f"></div>
               <br />
          </div>
          <input type="hidden" id="ass_c" name="ass_c" value="0" />
          <input type="hidden" id="cam_d" name="cam_d" value="" />
          <input type="hidden" id="ass_o" name="ass_o" value="<?php echo $_SESSION['wrkopcass']; ?>" />
          <input type="file" id="doc_j" class="bot-3" accept=".jpg, .png, .jpeg, .JPG, .PNG, .JPEG" />
          <input type="file" id="dct_j" class="bot-3" accept=".pdf, .PDF, .jpg, .png, .jpeg, .JPG, .PNG, .JPEG" />
     </form>
     <div class="row">
          <img class="subir" src="img/subir.png" />
          <img class="ima-4" src="img/preloader-5.gif">
     </div>
     <!------------------------------------------------------------------------------------------------------------------------------------------------------>
     <div class="modal fade" id="doc-pdf" tabindex="-1" role="dialog" aria-labelledby="tel-pdf" aria-hidden="true"
          data-backdrop="static">
          <div class="modal-dialog modal-xl" role="document">
               <!-- modal-sm modal-lg modal-xl -->
               <form id="frmMosFot" name="frmMosFot" action="man-docto.php" method="POST">
                    <div class="modal-content">
                         <div class="modal-header bg-primary text-white">
                              <h5 class="modal-title" id="tel-pdf">Demonstração de Documento</h5>
                              <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                   <span aria-hidden="true">&times;</span>
                              </button>
                         </div>
                         <div class="modal-body">
                              <div class="row text-center">
                                   <div id="lit_a" class="col-md-12">
                                        <span id="bot_a" class="bot-4">Visualizar o Documento</span>
                                   </div>
                              </div>
                              <div class="row text-center">
                                   <div class="col-md-12">
                                        <embed id="doc-p" src="" width="1110" height="750" type='application/pdf'>
                                   </div>
                              </div>
                              <br />
                              <div id="mos_a">
                                   <div class="row text-center">
                                        <div class="col-md-12">
                                             <img id="ima_a" src="<?php echo $ass_f; ?>" class="img-fluid" />
                                        </div>
                                   </div>
                                   <hr />
                                   <div class="row che-1">
                                        <div class="col-md-4"></div>
                                        <div class="col-md-4 text-center">
                                             <strong class="cor-1">Marque abaixo para assinar Documento !</strong><br />
                                             <input type="checkbox" id="opc_a" name="opc_a" value="1" />
                                        </div>
                                        <div class="col-md-4"></div>
                                   </div>
                                   <br />
                              </div>
                         </div>
                         <div class="modal-footer">
                              <button type="button" id="ass_d" name="ass_d"
                                   class="btn btn-outline-success">Assinar</button>
                              <button type="button" id="clo" name="close" class="btn btn-outline-danger"
                                   data-dismiss="modal">Fechar</button>
                         </div>
                    </div>
               </form>
          </div>
     </div>
     <!------------------------------------------------------------------------------------------------------------------------------------------------------>
     <div class="modal fade" id="qua-avi" tabindex="-1" role="dialog" aria-labelledby="tel-avi" aria-hidden="true"
          data-backdrop="true">
          <div class="modal-dialog modal-xl" role="document">
               <!-- modal-sm modal-lg modal-xl -->
               <form id="frmMosFot" name="frmMosFot" action="man-quadro.php" method="POST">
                    <div class="modal-content">
                         <div class="modal-header bg-primary text-white">
                              <h5 class="modal-title" id="tel-avi">Quadro de Avisos</h5>
                              <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                   <span aria-hidden="true">&times;</span>
                              </button>
                         </div>
                         <div class="modal-body">
                              <div class="form-row text-center">
                                   <div class="col-md-12">
                                        <div id="qua_a"></div>
                                   </div>
                              </div>
                              <br />
                         </div>
                         <div class="modal-footer">
                              <button type="button" id="clo" name="close" class="btn btn-outline-danger"
                                   data-dismiss="modal">Fechar</button>
                         </div>
                    </div>
               </form>
          </div>
     </div>
     <!------------------------------------------------------------------------------------------------------------------------------------------------------>
     <div class="modal fade" id="dad-esc" tabindex="-1" role="dialog" aria-labelledby="tel-esc" aria-hidden="true"
          data-backdrop="true">
          <div class="modal-dialog modal-lg" role="document">
               <!-- modal-sm modal-lg modal-xl -->
               <form id="frmMosEsc" name="frmMosEsc" action="menu03.php" method="POST">
                    <div class="modal-content">
                         <div class="modal-header bg-primary text-white">
                              <h5 class="modal-title" id="tel-esc">Demonstração de Escala de Trabalho</h5>
                              <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                   <span aria-hidden="true">&times;</span>
                              </button>
                         </div>
                         <div class="modal-body">
                              <div class="form-row">
                                   <div class="col-md-12">
                                        <div id="dad-e"></div>
                                   </div>
                              </div>
                         </div>
                         <div class="modal-footer">
                              <button type="button" id="fec_b" name="fec_b" class="btn btn-outline-danger"
                                   data-dismiss="modal">Fechar</button>
                         </div>
                    </div>
               </form>
          </div>
     </div>
     <!------------------------------------------------------------------------------------------------------------------------------------------------------>
     <div class="modal fade" id="dig-dic" tabindex="-1" role="dialog" aria-labelledby="tel-dic" aria-hidden="true"
          data-backdrop="static">
          <div class="modal-dialog modal-lg" role="document">
               <!-- modal-sm modal-lg modal-xl -->
               <form id="frmDigDic" name="frmDigDic" action="menu03.php" method="POST">
                    <div class="modal-content">
                         <div class="modal-header bg-primary text-white">
                              <h5 class="modal-title" id="tel-esc">Informação de Dicas e Sugestões</h5>
                              <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                   <span aria-hidden="true">&times;</span>
                              </button>
                         </div>
                         <div class="modal-body">
                              <div class="form-row">
                                   <div class="col-md-12">
                                        <label>Título da Sugestão</label>
                                        <input type="text" class="form-control" maxlength="50" id="tit" name="tit"
                                             value="<?php echo (isset($_REQUEST['tit']) == false ? "" : $_REQUEST['tit']); ?>"
                                             required />
                                   </div>
                              </div>
                              <div class="form-row">
                                   <div class="col-md-12">
                                        <label>Detalhamento da Sugestão</label>
                                        <textarea class="form-control" rows="5" id="obs"
                                             name="obs"><?php echo (isset($_REQUEST['obs']) == false ? "" : $_REQUEST['obs']); ?></textarea>
                                   </div>
                              </div>
                              <br />
                              <div class="form-row">
                                   <div class="col-md-12 text-center">
                                        <span>Desejo me Identificar ?</span> &nbsp;
                                        <input type="radio" id="ide_s" name="ide" value="1"
                                             <?php echo (isset($_REQUEST['ide']) != 1 ? "" : 'checked'); ?> /> Sim
                                        <input type="radio" id="ide_n" name="ide" value="0"
                                             <?php echo (isset($_REQUEST['ide']) != 0 ? "" : 'checked'); ?> /> Não
                                   </div>
                              </div>
                         </div>
                         <div class="modal-footer">
                              <button type="button" id="gra_d" name="gra_d"
                                   class="btn btn-outline-success">Salvar</button>
                              <button type="button" id="fec_d" name="fec_d" class="btn btn-outline-danger"
                                   data-dismiss="modal">Fechar</button>
                         </div>
                    </div>
               </form>
          </div>
     </div>
     <!------------------------------------------------------------------------------------------------------------------------------------------------------>
     <div class="modal fade" id="dad-esc" tabindex="-1" role="dialog" aria-labelledby="tel-esc" aria-hidden="true"
          data-backdrop="true">
          <div class="modal-dialog modal-lg" role="document">
               <!-- modal-sm modal-lg modal-xl -->
               <form id="frmMosEsc" name="frmMosEsc" action="menu03.php" method="POST">
                    <div class="modal-content">
                         <div class="modal-header bg-primary text-white">
                              <h5 class="modal-title" id="tel-esc">Demonstração de Escala de Trabalho</h5>
                              <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                   <span aria-hidden="true">&times;</span>
                              </button>
                         </div>
                         <div class="modal-body">
                              <div class="form-row">
                                   <div class="col-md-12">
                                        <div id="dad-e"></div>
                                   </div>
                              </div>
                         </div>
                         <div class="modal-footer">
                              <button type="button" id="fec_b" name="fec_b" class="btn btn-outline-danger"
                                   data-dismiss="modal">Fechar</button>
                         </div>
                    </div>
               </form>
          </div>
     </div>
     <!------------------------------------------------------------------------------------------------------------------------------------------------------>
     <div class="modal fade" id="dad-doc" tabindex="-1" role="dialog" aria-labelledby="tel-doc" aria-hidden="true"
          data-backdrop="static">
          <div class="modal-dialog modal-lg" role="document">
               <!-- modal-sm modal-lg modal-xl -->
               <form id="frmMosDoc" name="frmMosDoc" action="menu03.php" method="POST">
                    <div class="modal-content">
                         <div class="modal-header bg-primary text-white">
                              <h5 class="modal-title" id="tel-esc">Upload de Documento para a Administração</h5>
                              <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                   <span aria-hidden="true">&times;</span>
                              </button>
                         </div>
                         <div class="modal-body">
                              <div class="row">
                                   <div class="col-md-6">
                                        <label>Setor: </label>
                                        <strong><?php echo retorna_inf('daddescricao', 2, 'iddados',  $_SESSION['wrkcodset']); ?></strong>
                                   </div>
                                   <div class="col-md-6">
                                        <label>Colaborador: </label>
                                        <strong><?php echo $_SESSION['wrknomusu']; ?></strong>
                                   </div>
                              </div>
                              <br />
                              <div class="row">
                                   <div class="col-md-12">
                                        <label>Descrição do Documento</label>
                                        <input type="text" class="form-control" maxlength="50" id="des_d" name="des_d"
                                             value="" required />
                                   </div>
                              </div>
                         </div>
                         <div class="modal-footer">
                              <button type="button" id="upl_d" name="upl_d"
                                   class="btn btn-outline-success">Enviar</button>
                              <button type="button" id="fec_b" name="fec_b" class="btn btn-outline-danger"
                                   data-dismiss="modal">Fechar</button>
                         </div>
                    </div>
               </form>
          </div>
     </div>
     <!------------------------------------------------------------------------------------------------------------------------------------------------------>

</body>

</html>